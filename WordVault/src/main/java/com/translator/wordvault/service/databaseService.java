package com.translator.wordvault.service;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

@Service
public class databaseService {

  @Value("${spring.datasource.url}")
  private String datasourceurl;
  @Value("${spring.datasource.username}")
  private String username;
  @Value("${spring.datasource.password}")
  private String password;


  public Connection connect() throws SQLException{
    return DriverManager.getConnection(datasourceurl,username,password);
  }
}